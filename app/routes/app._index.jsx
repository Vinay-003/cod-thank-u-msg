import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const DEFAULT_SETTINGS = {
  enabled: true,
  heading: "COD Confirmation Required",
  badgeText: "ACTION NEEDED",
  bodyText:
    "Please confirm your COD order on WhatsApp. We've sent you a confirmation message.",
  warningText: "Without confirmation, your order will not be shipped.",
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const settings = await prisma.codMessageSettings.findUnique({
    where: {
      shop: session.shop,
    },
  });

  return {
    settings: {
      ...DEFAULT_SETTINGS,
      ...(settings || {}),
    },
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "on";
  const heading = String(formData.get("heading") || "").trim();
  const badgeText = String(formData.get("badgeText") || "").trim();
  const bodyText = String(formData.get("bodyText") || "").trim();
  const warningText = String(formData.get("warningText") || "").trim();

  const data = {
    enabled,
    heading: heading || DEFAULT_SETTINGS.heading,
    badgeText: badgeText || DEFAULT_SETTINGS.badgeText,
    bodyText: bodyText || DEFAULT_SETTINGS.bodyText,
    warningText: warningText || DEFAULT_SETTINGS.warningText,
  };

  await prisma.codMessageSettings.upsert({
    where: {
      shop: session.shop,
    },
    update: data,
    create: {
      shop: session.shop,
      ...data,
    },
  });

  return {
    ok: true,
    settings: data,
  };
};

export default function Index() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const isSaving = fetcher.state === "submitting";

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("COD message settings saved");
    }
  }, [fetcher.data, shopify]);

  const currentSettings = fetcher.data?.settings || settings;

  return (
    <s-page heading="COD confirmation message">
      <s-section heading="Order status banner">
        <s-paragraph>
          Edit the COD confirmation message shown to customers on the order status page.
        </s-paragraph>

        <fetcher.Form method="post">
          <s-stack gap="base">
            <s-checkbox
              name="enabled"
              defaultChecked={currentSettings.enabled}
            >
              Show banner for COD orders
            </s-checkbox>

            <s-text-field
              label="Banner heading"
              name="heading"
              defaultValue={currentSettings.heading}
            />

            <s-text-field
              label="Badge text"
              name="badgeText"
              defaultValue={currentSettings.badgeText}
            />

            <s-text-area
              label="Main message"
              name="bodyText"
              defaultValue={currentSettings.bodyText}
              rows={3}
            />

            <s-text-area
              label="Warning message"
              name="warningText"
              defaultValue={currentSettings.warningText}
              rows={2}
            />

            <s-button
              type="submit"
              variant="primary"
              {...(isSaving ? { loading: true } : {})}
            >
              Save settings
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      <s-section heading="Preview">
        <s-banner heading={currentSettings.heading} tone="warning">
          <s-stack gap="base">
            <s-badge tone="critical">
              {currentSettings.badgeText}
            </s-badge>

            <s-text>
              {currentSettings.bodyText}
            </s-text>

            <s-heading>
              {currentSettings.warningText}
            </s-heading>
          </s-stack>
        </s-banner>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
