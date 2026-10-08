import Link from "next/link";

import Header from "@/components/Header";

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <div className="border-b border-black pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
            Legal
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Last updated: October 2026
          </p>
        </div>

        <div className="mt-10 space-y-10 text-sm leading-7 text-[var(--color-body)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              1. About this policy
            </h2>

            <p className="mt-3">
              tareka. is a directory of recycling, collection, upcycling, and
              other material-recovery businesses in Kenya. This Privacy Policy
              explains what information we collect when you use the tareka.
              website, why we collect it, and how we use it.
            </p>

            <p className="mt-3">
              By using the website or submitting information to tareka., you
              acknowledge the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              2. Information we collect
            </h2>

            <p className="mt-3">
              We may collect information you voluntarily provide when you use
              features of the website, including when you suggest a business
              or submit a business claim.
            </p>

            <p className="mt-3">This may include:</p>

            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Your name.</li>
              <li>Your role or relationship to a business.</li>
              <li>Your contact information.</li>
              <li>Your email address, where provided.</li>
              <li>Information about a business you suggest.</li>
              <li>Business descriptions, materials, and contact details.</li>
              <li>Source URLs or other information supporting a submission.</li>
              <li>Correction requests relating to an existing listing.</li>
              <li>Information you provide with your consent for us to use.</li>
            </ul>

            <p className="mt-3">
              We may also collect basic technical information necessary to
              operate and protect the website, such as request information,
              browser information, and security-related information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              3. Business information
            </h2>

            <p className="mt-3">
              tareka. is a public directory. Business information may be
              researched from publicly available sources, provided by business
              representatives, or submitted by members of the public.
            </p>

            <p className="mt-3">
              A public suggestion does not automatically create a public
              listing. We review and research submissions before publishing
              them.
            </p>

            <p className="mt-3">
              Where a business representative claims an existing listing, we
              may use the information they provide to assess the claim and
              investigate requested corrections. Approval of a claim does not
              automatically mean that every requested correction will be
              published.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              4. How we use information
            </h2>

            <p className="mt-3">
              We use information collected through the website to:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Review and process business suggestions.</li>
              <li>Review and process business claims.</li>
              <li>Research and verify directory information.</li>
              <li>Maintain accurate business listings.</li>
              <li>Respond to enquiries and submissions.</li>
              <li>Improve the directory and its content.</li>
              <li>Protect the website against abuse and misuse.</li>
              <li>Maintain the security and reliability of our systems.</li>
            </ul>

            <p className="mt-3">
              We do not publish private contact information simply because it
              was submitted to us. Information published in a directory listing
              is selected as part of our editorial and verification process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              5. Information published in the directory
            </h2>

            <p className="mt-3">
              Information about businesses may be publicly displayed on tareka.
              This can include a business name, description, location,
              materials accepted, business type, website, phone number, email
              address, verification status, and other relevant listing
              information.
            </p>

            <p className="mt-3">
              The purpose of publishing this information is to help people
              discover where materials can be collected, recycled, reused,
              recovered, or otherwise kept in circulation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              6. Consent
            </h2>

            <p className="mt-3">
              Some forms on tareka. ask for explicit consent to use information
              or images supplied by a person submitting the information.
              Consent is used for the purpose stated in the relevant form.
            </p>

            <p className="mt-3">
              Providing information to suggest a business does not by itself
              mean that the information will be published exactly as
              submitted. Tareka. may research, edit, verify, or decline
              information before publication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              7. Cookies and similar technologies
            </h2>

            <p className="mt-3">
              The public directory does not need advertising cookies to provide
              its core functionality.
            </p>

            <p className="mt-3">
              We may use necessary cookies or similar browser storage where
              required to operate or secure parts of the website. For example,
              administrative authentication uses a secure session cookie so
              authorised administrators can remain signed in.
            </p>

            <p className="mt-3">
              If we introduce analytics, advertising, or other non-essential
              tracking technologies, we will provide appropriate information
              about those technologies and obtain consent where required by
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              8. Sharing information
            </h2>

            <p className="mt-3">
              We do not sell personal information to advertisers.
            </p>

            <p className="mt-3">
              Information may be shared with service providers where necessary
              to operate, secure, maintain, or improve the website and its
              infrastructure. We may also disclose information where required
              by law or where necessary to protect our rights, users, or
              systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              9. Data retention and security
            </h2>

            <p className="mt-3">
              We retain information for as long as reasonably necessary for the
              purposes described in this policy, including maintaining directory
              records, reviewing submissions, handling claims, and maintaining
              appropriate business and security records.
            </p>

            <p className="mt-3">
              We take reasonable technical and organisational measures to
              protect information against unauthorised access, alteration,
              disclosure, or destruction. However, no internet service can
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              10. Your choices and rights
            </h2>

            <p className="mt-3">
              Depending on applicable law, you may have rights relating to your
              personal information, including the right to request access,
              correction, deletion, or other forms of handling restriction.
            </p>

            <p className="mt-3">
              If you are a business representative and believe information in a
              listing is inaccurate, you can use the claim process or contact
              us so that the information can be reviewed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              11. Third-party websites
            </h2>

            <p className="mt-3">
              Directory listings may contain links to business websites,
              social-media pages, mapping services, or other third-party
              websites. We do not control those websites and are not
              responsible for their privacy practices. You should review the
              privacy policies of third-party services you visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              12. Changes to this policy
            </h2>

            <p className="mt-3">
              We may update this Privacy Policy from time to time to reflect
              changes to the website, our practices, or applicable requirements.
              The updated version will be posted on this page with a revised
              update date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">
              13. Contact
            </h2>

            <p className="mt-3">
              If you have a privacy question or request, contact us at{" "}
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