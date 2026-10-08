import Link from "next/link";

import Header from "@/components/Header";

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <div className="border-b border-black pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
            Legal
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Terms of Use
          </h1>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Last updated: October 2026
          </p>
        </div>

        <div className="mt-10 space-y-10 text-sm leading-7 text-[var(--color-body)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              1. About tareka.
            </h2>

            <p className="mt-3">
              tareka. is a directory designed to help people discover
              businesses and organisations involved in recycling, collection,
              upcycling, reuse, and material recovery in Kenya.
            </p>

            <p className="mt-3">
              The directory is provided as an information and discovery
              service. It is not a marketplace and does not process transactions
              between users and listed businesses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              2. Using the directory
            </h2>

            <p className="mt-3">
              You may use the website to search for and learn about listed
              businesses and to contact those businesses directly using contact
              information made available in their listings.
            </p>

            <p className="mt-3">
              You are responsible for independently confirming details that may
              affect your decision to visit or contact a business. This
              includes opening hours, accepted materials, prices, collection or
              drop-off arrangements, location, availability, and other
              operational details.
            </p>

            <p className="mt-3">
              Information can change after a listing has been published.
              Materials accepted may vary, and a listing should not be treated
              as a guarantee that a business will accept a particular material
              at a particular time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              3. Verification
            </h2>

            <p className="mt-3">
              tareka. may research and verify business information using
              available evidence. A verification status indicates the state of
              our review at the relevant time; it does not constitute an
              endorsement, certification, accreditation, or guarantee of the
              business.
            </p>

            <p className="mt-3">
              A business&apos;s inclusion in the directory does not mean that tareka.
              has entered into a partnership with, employs, recommends, or
              financially represents that business.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              4. Business suggestions
            </h2>

            <p className="mt-3">
              Users may suggest businesses for inclusion in the directory.
              Submitting a suggestion does not guarantee publication.
            </p>

            <p className="mt-3">
              We may research, edit, verify, reject, or decline information
              submitted through the suggestion form. We may also choose not to
              publish a suggested business where we cannot establish sufficient
              information or relevance.
            </p>

            <p className="mt-3">
              You should not submit confidential, sensitive, unlawful, or
              third-party personal information through the suggestion form
              unless there is a legitimate reason to do so.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              5. Business claims
            </h2>

            <p className="mt-3">
              A person who represents a listed business may submit a claim to
              identify themselves as connected to that business and request
              corrections.
            </p>

            <p className="mt-3">
              Submitting a claim does not automatically change a listing.
              Claims are reviewed, and requested corrections may require
              separate verification before they are published.
            </p>

            <p className="mt-3">
              You must provide truthful information when submitting a claim and
              must not falsely represent yourself as a business owner,
              employee, manager, representative, or other authorised person.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              6. Information and content
            </h2>

            <p className="mt-3">
              Information on tareka. may come from business representatives,
              members of the public, public sources, and our own research.
              Although we aim to maintain accurate listings, we do not
              guarantee that every piece of information is complete, current,
              or error-free.
            </p>

            <p className="mt-3">
              If you submit information or images to tareka. and provide the
              relevant consent, you confirm that you have the right to provide
              that material for the stated purpose and that doing so does not
              knowingly infringe another person&apos;s rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              7. Prohibited use
            </h2>

            <p className="mt-3">
              You must not use tareka. to:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Submit knowingly false or misleading information.</li>
              <li>Impersonate another person or business.</li>
              <li>Attempt to gain unauthorised access to the website or its systems.</li>
              <li>Interfere with the operation or security of the website.</li>
              <li>Use automated methods to abuse, overload, or scrape the service.</li>
              <li>Submit unlawful, malicious, or harmful material.</li>
              <li>Use directory information for fraudulent or abusive purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              8. Third-party businesses and services
            </h2>

            <p className="mt-3">
              tareka. does not control the businesses listed in the directory.
              Any transaction, visit, collection arrangement, purchase,
              delivery, service agreement, or other interaction between you and
              a listed business is between you and that business.
            </p>

            <p className="mt-3">
              Links to third-party websites are provided for convenience. We
              are not responsible for the content, availability, security, or
              practices of those external websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              9. Intellectual property
            </h2>

            <p className="mt-3">
              Unless otherwise indicated, the tareka. website, its branding,
              original interface design, original written content, software,
              and other original materials are owned by or licensed to tareka.
              and may not be reproduced or commercially exploited without
              appropriate permission.
            </p>

            <p className="mt-3">
              Business names, logos, trademarks, photographs, and other
              materials belonging to third parties remain the property of their
              respective owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              10. Availability
            </h2>

            <p className="mt-3">
              We aim to keep tareka. available and reliable, but we do not
              guarantee uninterrupted access. We may modify, suspend, or
              temporarily restrict parts of the website for maintenance,
              security, improvements, or other operational reasons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              11. Disclaimer
            </h2>

            <p className="mt-3">
              tareka. provides directory information on an informational basis.
              To the extent permitted by applicable law, we do not guarantee
              the accuracy, completeness, suitability, availability, or
              reliability of information supplied by or relating to third-party
              businesses.
            </p>

            <p className="mt-3">
              You should exercise your own judgement and verify important
              information directly with a business before relying on it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              12. Limitation of liability
            </h2>

            <p className="mt-3">
              To the extent permitted by applicable law, tareka. will not be
              responsible for losses, damages, disputes, or other consequences
              arising from your interactions with businesses listed in the
              directory or from reliance on information that has changed,
              become outdated, or was supplied by a third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              13. Changes to these terms
            </h2>

            <p className="mt-3">
              We may update these Terms of Use as the website and its services
              develop. Updated terms will be posted on this page with a revised
              update date. Your continued use of the website after an update
              constitutes use under the updated terms, to the extent permitted
              by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              14. Contact
            </h2>

            <p className="mt-3">
              Questions about these Terms of Use can be sent to{" "}
              <a
                href="mailto:hello@tareka.co"
                className="font-medium underline decoration-[#B9E4C4] decoration-2 underline-offset-2"
              >
                hello@tareka.co
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-black pt-6">
          <Link
            href="/"
            className="text-sm font-medium underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4 transition hover:text-[var(--color-accent-text)]"
          >
            ← Back to tareka.
          </Link>
        </div>
      </main>
    </>
  );
}