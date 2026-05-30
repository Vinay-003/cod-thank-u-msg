import prisma from "../../db.server";

const ADMIN_API_VERSION = "2025-10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return Response.json(
    { error: "Method not allowed" },
    {
      status: 405,
      headers: corsHeaders,
    },
  );
}

export async function action({ request }) {
  try {
    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return Response.json(
        { isCod: false, error: "Missing orderId" },
        { status: 400, headers: corsHeaders },
      );
    }

    const shop =
      body.shop ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      "cod-thank-you-test.myshopify.com";

    const session = await prisma.session.findFirst({
      where: {
        shop,
        isOnline: false,
      },
      orderBy: {
        id: "asc",
      },
    });

    const token = session?.accessToken;

    if (!token) {
      console.error("No offline Shopify session token found in /api/check-cod", {
        shop,
        orderId,
      });

      return Response.json(
        {
          isCod: false,
          error: `No stored offline session token found for ${shop}. Reinstall the app on this store.`,
        },
        { status: 200, headers: corsHeaders },
      );
    }

    const response = await fetch(
      `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: `
            query GetOrderPaymentMethod($id: ID!) {
              order(id: $id) {
                id
                name
                paymentGatewayNames
                transactions {
                  gateway
                  kind
                  status
                }
              }
            }
          `,
          variables: {
            id: orderId,
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error("Shopify GraphQL failed in /api/check-cod", {
        shop,
        orderId,
        status: response.status,
        statusText: response.statusText,
        result,
      });

      return Response.json(
        {
          isCod: false,
          error: "GraphQL error",
          status: response.status,
          details: result.errors || result,
        },
        { status: 200, headers: corsHeaders },
      );
    }

    const order = result.data?.order;

    if (!order) {
      return Response.json(
        {
          isCod: false,
          error: "Order not found",
        },
        { headers: corsHeaders },
      );
    }

    const paymentText = [
      ...(order.paymentGatewayNames || []),
      ...(order.transactions || []).map(
        (transaction) => transaction.gateway || "",
      ),
    ]
      .join(" ")
      .toLowerCase();

    const isCod =
      paymentText.includes("cash on delivery") ||
      paymentText.includes("cod") ||
      paymentText.includes("cash");

    return Response.json(
      {
        isCod,
        orderName: order.name,
        paymentGatewayNames: order.paymentGatewayNames || [],
        paymentText,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("COD check failed:", error);

    return Response.json(
      { isCod: false, error: error.message },
      { status: 200, headers: corsHeaders },
    );
  }
}