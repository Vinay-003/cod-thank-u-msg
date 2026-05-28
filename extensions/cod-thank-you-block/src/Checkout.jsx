import '@shopify/ui-extensions/preact';
import {render} from 'preact';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  return (
    <s-banner heading="Cash on Delivery" tone="info">
      <s-stack gap="base">
        <s-text>
          If you selected Cash on Delivery, please keep the exact cash amount ready at the time of delivery.
        </s-text>
        <s-text>
          Our delivery partner will collect the payment when your order arrives.
        </s-text>
      </s-stack>
    </s-banner>
  );
}