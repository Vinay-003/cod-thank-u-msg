import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

const APP_BACKEND_URL = 'https://cod-thank-u-msg.vercel.app';
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

        let data = null;

        try {
          data = await response.json();
        } catch (parseError) {
          console.log('COD block: failed to parse API response', {
            status: response.status,
            parseError,
          });
          setIsCod(false);
          return;
        }

        console.log('COD block response:', {
          status: response.status,
          data,
        });

        setIsCod(Boolean(data?.isCod));
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
          Please confirm your COD order on WhatsApp. We've sent you a confirmation message. 
        </s-text>
        <s-text>
          Without confirmation, your order will not be shipped.
        </s-text>
      </s-stack>
    </s-banner>
  );
}


