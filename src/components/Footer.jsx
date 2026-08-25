import { toSocialLinks, safeUrl } from "../lib/branding";

export default function Footer({ brand }) {
  const links = toSocialLinks(brand.socialMedia);
  const website = safeUrl(brand.website);

  return (
    <footer className="footer">
      {website && (
        <a className="footer-site" href={website} target="_blank" rel="noreferrer">
          {website.replace(/^https?:\/\//, "")}
        </a>
      )}

      {links.length > 0 && (
        <nav className="footer-social" aria-label="Social links">
          {links.map((l) => (
            <a key={l.key} href={l.url} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </nav>
      )}

      <div className="footer-contact">
        {brand.email && (
          <a href={`mailto:${brand.email}`}>{brand.email}</a>
        )}
        {brand.mobile && (
          <a href={`tel:${brand.mobile.replace(/\s/g, "")}`}>{brand.mobile}</a>
        )}
      </div>
    </footer>
  );
}
