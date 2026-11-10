"use client"

import { WarningBox } from "@/components/ui/warningBox"

/**
 * Under the channels — added 2026-11-09. A link with no tag is not an error the
 * app can catch: the lead simply lands in SEO, so this says it up front.
 */
function ChannelWarning() {
  return (
    <WarningBox storageKey="channel-warning" title="No tag means SEO">
      <ul className="mt-1 flex list-disc flex-col gap-1.5 pl-4">
        <li>
          Always share the links from this page. If a link has no <b>?utm_source=</b> tag, the LMS counts the lead
          as <b>SEO</b>.
        </li>
        <li>
          Copy the link, don&apos;t type it. A typo in the tag, like <b>faceboook</b>, counts as a different channel.
        </li>
      </ul>
    </WarningBox>
  )
}

export { ChannelWarning }
