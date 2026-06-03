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

    const sessions = await prisma.session.findMany({
      where: {
        shop,
        isOnline: false,
        accessToken: {
          not: "",
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    console.log("Offline sessions found in /api/check-cod", {
      shop,
      count: sessions.length,
      sessionIds: sessions.map((s) => s.id),
    });

    const session = sessions[0];
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
                tags
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
        sessionId: session?.id,
        status: response.status,
        statusText: response.statusText,
        result,
      });

      if (response.status === 401 && session?.id) {
        try {
          await prisma.session.delete({
            where: {
              id: session.id,
            },
          });

          console.error("Deleted invalid Shopify offline session after 401", {
            shop,
            sessionId: session.id,
          });
        } catch (deleteError) {
          console.error("Failed to delete invalid Shopify offline session", {
            shop,
            sessionId: session.id,
            deleteError,
          });
        }
      }

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
        { status: 200, headers: corsHeaders },
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

    const settings = await prisma.codMessageSettings.findUnique({
      where: {
        shop,
      },
    });

    const defaultSettings = {
      enabled: true,
      heading: "COD Confirmation Required",
      badgeText: "ACTION NEEDED",
      bodyText:
        "Please confirm your COD order on WhatsApp. We've sent you a confirmation message.",
      warningText: "Without confirmation, your order will not be shipped.",
      confirmedHeading: "Order Confirmed",
      confirmedBadgeText: "CONFIRMED",
      confirmedBodyText: "Your COD order has been confirmed via WhatsApp.",
      confirmedWarningText: "Thank you for confirming your order.",
      cancelledHeading: "Order Cancelled",
      cancelledBadgeText: "CANCELLED",
      cancelledBodyText: "Your COD order has been cancelled via WhatsApp.",
      cancelledWarningText: "If this was a mistake, please contact support.",
    };

    const messageSettings = {
      ...defaultSettings,
      ...(settings || {}),
    };

    const tags = order.tags || [];
    const tagString = Array.isArray(tags) ? tags.join(", ").toLowerCase() : String(tags).toLowerCase();

    let message;
    if (tagString.includes("confirmed by wati")) {
      message = {
        heading: messageSettings.confirmedHeading,
        badgeText: messageSettings.confirmedBadgeText,
        bodyText: messageSettings.confirmedBodyText,
        warningText: messageSettings.confirmedWarningText,
      };
    } else if (tagString.includes("cancelled by wati")) {
      message = {
        heading: messageSettings.cancelledHeading,
        badgeText: messageSettings.cancelledBadgeText,
        bodyText: messageSettings.cancelledBodyText,
        warningText: messageSettings.cancelledWarningText,
      };
    } else {
      message = {
        heading: messageSettings.heading,
        badgeText: messageSettings.badgeText,
        bodyText: messageSettings.bodyText,
        warningText: messageSettings.warningText,
      };
    }

    return Response.json(
      {
        isCod: Boolean(isCod && messageSettings.enabled),
        orderName: order.name,
        paymentGatewayNames: order.paymentGatewayNames || [],
        paymentText,
        tags: Array.isArray(tags) ? tags : [],
        message,
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("COD check failed:", error);

    return Response.json(
      { isCod: false, error: error.message },
      { status: 200, headers: corsHeaders },
    );
  }
}