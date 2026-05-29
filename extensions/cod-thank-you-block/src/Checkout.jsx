import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

const APP_BACKEND_URL = 'https://online-brilliant-laundry-handled.trycloudflare.com';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCod, setIsCod] = useState(false);

  useEffect(() => {
    async function checkCodPayment() {
      try {
        const shopifyApi = globalThis.shopify;

        const orderId =
          shopifyApi?.order?.value?.id ||
          shopifyApi?.orderConfirmation?.value?.order?.id ||
          null;

        const shopDomain =
          shopifyApi?.shop?.myshopifyDomain ||
          shopifyApi?.shop?.value?.myshopifyDomain ||
          'cod-thank-you-test.myshopify.com';

        if (!orderId) {
          console.log('COD block: missing order ID');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${APP_BACKEND_URL}/api/check-cod`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            shop: shopDomain,
          }),
        });

        const data = await response.json();

        console.log('COD block response:', data);

        setIsCod(Boolean(data.isCod));
      } catch (error) {
        console.log('COD block error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkCodPayment();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!isCod) {
    return null;
  }

  return (
    <s-banner heading="Cash on Delivery" tone="info">
      <s-stack gap="base">
        <s-text>
          If you have placed a COD order, please confirm it through WhatsApp.
        </s-text>
        <s-text>
          We've sent you a message requesting confirmation.
        </s-text>
      </s-stack>
    </s-banner>
  );
}