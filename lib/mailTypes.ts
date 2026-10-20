/**
 * The shape the Inbox draws — what the backend's `/api/inbox` returns.
 *
 * <p>Client-safe on purpose, the same split as `userTypes`, `systemTypes` and
 * `backupTypes`: the components are shared between the server page and the
 * client pieces that handle selection, and a file that reads the session cookie
 * cannot be imported from the browser.
 *
 * <p>Real since 2026-10-20, the oneBase way: one Gmail mailbox (Andrew's), set
 * on the server, that every brand address forwards into. Read live over IMAP
 * and answered over SMTP — see the backend's GmailClient. Nothing is copied
 * into the database, so what this shows is what Gmail has.
 */

/**
 * One message in a list.
 *
 * <p>A single message rather than a thread. Gmail groups replies; this shows
 * each one on its own, which is simpler and loses nothing for now.
 */
export type Mail = {
  /** "inbox.1234" — the folder and Gmail's id for it there. */
  id: string
  /** Who sent it — or, in Sent and Drafts, "To: …" who it went to. */
  name: string
  email: string
  subject: string
  /** ISO timestamp. */
  receivedAt: string
  /** The first few lines, as plain text. */
  preview: string
  read: boolean
  /** Starred in Gmail. */
  starred: boolean
  hasAttachments: boolean
  /** Your own Gmail labels. */
  labels: string[]
  /** The brand address it was sent to (or, in Sent, from). Null for none. */
  brand: string | null
}

/** A file attached to a message. `index` is how to ask for it. */
export type MailAttachment = {
  index: number
  name: string
  contentType: string
  size: number
}

/** One message, open. */
export type MailMessage = {
  id: string
  name: string
  email: string
  to: string[]
  cc: string[]
  replyTo: string | null
  subject: string
  receivedAt: string
  /**
   * The message as the sender wrote it, or null for plain text only.
   *
   * <p>⚠️ Shown only inside a sandboxed frame with scripts off — never put into
   * the page itself. Mail is the one place markup arrives from strangers.
   */
  html: string | null
  /** The plain-text version, made from the HTML when there is none. */
  text: string
  read: boolean
  starred: boolean
  labels: string[]
  attachments: MailAttachment[]
  messageId: string | null
  /** Which folder it is in — decides which actions make sense. */
  folder: string
  /** The brand address it was sent to — answers go out from it. */
  brand: string | null
}

/** One page of a folder, newest first. `page` is 1-based. */
export type MailPage = {
  mails: Mail[]
  total: number
  page: number
  size: number
  totalPages: number
}

/**
 * What may be done to a message, for the account looking at it.
 *
 * <p>Mirrors the `INBOX:*` permissions exactly — the backend checks the same
 * ones, so these only decide which buttons are drawn as usable.
 */
export type MailAbilities = {
  send: boolean
  delete: boolean
  archive: boolean
  star: boolean
}

export const NO_ABILITIES: MailAbilities = {
  send: false,
  delete: false,
  archive: false,
  star: false,
}

/** An address mail can go out from — the mailbox itself, or a brand. */
export type MailSender = {
  name: string
  email: string
  /** A brand's logo, read from its website. Null for the mailbox itself. */
  logoUrl: string | null
}

/** The mailbox at a glance. */
export type InboxOverview = {
  email: string
  displayName: string
  /** The brand addresses forwarded into this Gmail, for the filter. */
  brands: MailSender[]
  /** Every From address: the mailbox first, then each brand. */
  senders: MailSender[]
  folders: MailFolder[]
}

/**
 * A folder in the mailbox.
 *
 * <p>`group` splits the everyday folders from the ones you put things in to be
 * rid of them — junk, trash, the archive.
 */
export type MailFolder = {
  id: string
  label: string
  icon: string
  /** Unread messages — counted for the Inbox and Junk only. */
  unread: number
  group: "working" | "aside"
}

/**
 * What the address bar says. Every control on the Inbox writes here, so a
 * view can be linked to and the Back button works.
 */
export type MailQuery = {
  /** The open message. */
  mail?: string
  /** "unread", or nothing for everything. */
  filter?: string
  /** Gmail search words. */
  q?: string
  /** A brand address — only its mail. */
  brand?: string
  folder?: string
  /** 1-based page of the folder. */
  page?: string
  /** "new" opens the writing pane on the right. */
  compose?: string
}

/** A quick look at the Inbox: unread emails, and Gmail's next id (changes when mail arrives). */
export type InboxPulse = {
  unread: number
  latest: number
}

/** How a message is being written: new, or answering the open one. */
export type ComposeMode = "new" | "reply" | "replyAll" | "forward"
