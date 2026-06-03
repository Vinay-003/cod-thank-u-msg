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
  confirmedHeading: "Order Confirmed",
  confirmedBadgeText: "CONFIRMED",
  confirmedBodyText: "Your COD order has been confirmed via WhatsApp.",
  confirmedWarningText: "Thank you for confirming your order.",
  cancelledHeading: "Order Cancelled",
  cancelledBadgeText: "CANCELLED",
  cancelledBodyText: "Your COD order has been cancelled via WhatsApp.",
  cancelledWarningText: "If this was a mistake, please contact support.",
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
  const confirmedHeading = String(formData.get("confirmedHeading") || "").trim();
  const confirmedBadgeText = String(formData.get("confirmedBadgeText") || "").trim();
  const confirmedBodyText = String(formData.get("confirmedBodyText") || "").trim();
  const confirmedWarningText = String(formData.get("confirmedWarningText") || "").trim();
  const cancelledHeading = String(formData.get("cancelledHeading") || "").trim();
  const cancelledBadgeText = String(formData.get("cancelledBadgeText") || "").trim();
  const cancelledBodyText = String(formData.get("cancelledBodyText") || "").trim();
  const cancelledWarningText = String(formData.get("cancelledWarningText") || "").trim();

  const data = {
    enabled,
    heading: heading || DEFAULT_SETTINGS.heading,
    badgeText: badgeText || DEFAULT_SETTINGS.badgeText,
    bodyText: bodyText || DEFAULT_SETTINGS.bodyText,
    warningText: warningText || DEFAULT_SETTINGS.warningText,
    confirmedHeading: confirmedHeading || DEFAULT_SETTINGS.confirmedHeading,
    confirmedBadgeText: confirmedBadgeText || DEFAULT_SETTINGS.confirmedBadgeText,
    confirmedBodyText: confirmedBodyText || DEFAULT_SETTINGS.confirmedBodyText,
    confirmedWarningText: confirmedWarningText || DEFAULT_SETTINGS.confirmedWarningText,
    cancelledHeading: cancelledHeading || DEFAULT_SETTINGS.cancelledHeading,
    cancelledBadgeText: cancelledBadgeText || DEFAULT_SETTINGS.cancelledBadgeText,
    cancelledBodyText: cancelledBodyText || DEFAULT_SETTINGS.cancelledBodyText,
    cancelledWarningText: cancelledWarningText || DEFAULT_SETTINGS.cancelledWarningText,
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

function BannerPreview({
  heading,
  badgeText,
  bodyText,
  warningText,
  tone = "warning",
}) {
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-banner heading={heading} tone={tone}>
        <s-stack gap="base">
          <s-badge tone={tone === "success" ? "success" : "critical"}>
            {badgeText}
          </s-badge>
          <s-text>{bodyText}</s-text>
          <s-heading>{warningText}</s-heading>
        </s-stack>
      </s-banner>
    </s-box>
  );
}

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
      <fetcher.Form method="post">
        <s-stack gap="28px">

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-checkbox
              name="enabled"
              defaultChecked={currentSettings.enabled}
            >
              Show banner for COD orders
            </s-checkbox>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack gap="18px" direction="block">
              <s-heading>Pending Confirmation</s-heading>
              <s-text color="subdued">
                Shown when the order is COD and no WATI tag has been detected yet.
              </s-text>

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

              <s-divider></s-divider>

              <BannerPreview
                heading={currentSettings.heading}
                badgeText={currentSettings.badgeText}
                bodyText={currentSettings.bodyText}
                warningText={currentSettings.warningText}
                tone="warning"
              />
            </s-stack>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack gap="18px" direction="block">
              <s-heading>Confirmed by WATI</s-heading>
              <s-text color="subdued">
                Shown when the order has the "Confirmed by WATI" tag.
              </s-text>

              <s-text-field
                label="Banner heading"
                name="confirmedHeading"
                defaultValue={currentSettings.confirmedHeading}
              />
              <s-text-field
                label="Badge text"
                name="confirmedBadgeText"
                defaultValue={currentSettings.confirmedBadgeText}
              />
              <s-text-area
                label="Main message"
                name="confirmedBodyText"
                defaultValue={currentSettings.confirmedBodyText}
                rows={3}
              />
              <s-text-area
                label="Warning message"
                name="confirmedWarningText"
                defaultValue={currentSettings.confirmedWarningText}
                rows={2}
              />

              <s-divider></s-divider>

              <BannerPreview
                heading={currentSettings.confirmedHeading}
                badgeText={currentSettings.confirmedBadgeText}
                bodyText={currentSettings.confirmedBodyText}
                warningText={currentSettings.confirmedWarningText}
                tone="success"
              />
            </s-stack>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack gap="18px" direction="block">
              <s-heading>Cancelled by WATI</s-heading>
              <s-text color="subdued">
                Shown when the order has the "Cancelled by WATI" tag.
              </s-text>

              <s-text-field
                label="Banner heading"
                name="cancelledHeading"
                defaultValue={currentSettings.cancelledHeading}
              />
              <s-text-field
                label="Badge text"
                name="cancelledBadgeText"
                defaultValue={currentSettings.cancelledBadgeText}
              />
              <s-text-area
                label="Main message"
                name="cancelledBodyText"
                defaultValue={currentSettings.cancelledBodyText}
                rows={3}
              />
              <s-text-area
                label="Warning message"
                name="cancelledWarningText"
                defaultValue={currentSettings.cancelledWarningText}
                rows={2}
              />

              <s-divider></s-divider>

              <BannerPreview
                heading={currentSettings.cancelledHeading}
                badgeText={currentSettings.cancelledBadgeText}
                bodyText={currentSettings.cancelledBodyText}
                warningText={currentSettings.cancelledWarningText}
                tone="critical"
              />
            </s-stack>
          </s-box>

          <s-button
            type="submit"
            variant="primary"
            {...(isSaving ? { loading: true } : {})}
          >
            Save settings
          </s-button>

        </s-stack>
      </fetcher.Form>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
