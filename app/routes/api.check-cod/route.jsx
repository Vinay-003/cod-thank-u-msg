const ADMIN_API_VERSION = "2025-10";

export async function action({ request }) {
  try {
    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return Response.json(
        { isCod: false, error: "Missing orderId" },
        { status: 400 },
      );
    }

    const shop =
      body.shop ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      "cod-thank-you-test.myshopify.com";

    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!token) {
      return Response.json(
        { isCod: false, error: "Missing SHOPIFY_ADMIN_ACCESS_TOKEN" },
        { status: 500 },
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
      return Response.json(
        {
          isCod: false,
          error: "GraphQL error",
          details: result.errors || result,
        },
        { status: 500 },
      );
    }

    const order = result.data?.order;

    if (!order) {
      return Response.json({
        isCod: false,
        error: "Order not found",
      });
    }

    const paymentText = [
      ...(order.paymentGatewayNames || []),
      ...(order.transactions || []).map((transaction) => transaction.gateway || ""),
    ]
      .join(" ")
      .toLowerCase();

    const isCod =
      paymentText.includes("cash on delivery") ||
      paymentText.includes("cod") ||
      paymentText.includes("cash");

    return Response.json({
      isCod,
      orderName: order.name,
      paymentGatewayNames: order.paymentGatewayNames || [],
      paymentText,
    });
  } catch (error) {
    console.error("COD check failed:", error);

    return Response.json(
      { isCod: false, error: error.message },
      { status: 500 },
    );
  }
}