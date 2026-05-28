import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { admin } = await authenticate.public.checkout(request);

    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return json(
        {
          isCod: false,
          error: "Missing orderId",
        },
        { status: 400 },
      );
    }

    const response = await admin.graphql(
      `#graphql
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
      {
        variables: {
          id: orderId,
        },
      },
    );

    const result = await response.json();
    const order = result.data?.order;

    if (!order) {
      return json({
        isCod: false,
        error: "Order not found",
      });
    }

    const gatewayNames = order.paymentGatewayNames || [];
    const transactions = order.transactions || [];

    const paymentText = [
      ...gatewayNames,
      ...transactions.map((transaction) => transaction.gateway || ""),
    ]
      .join(" ")
      .toLowerCase();

    const isCod =
      paymentText.includes("cash on delivery") ||
      paymentText.includes("cod") ||
      paymentText.includes("cash");

    return json({
      isCod,
      paymentText,
    });
  } catch (error) {
    console.error("COD check failed:", error);

    return json(
      {
        isCod: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}