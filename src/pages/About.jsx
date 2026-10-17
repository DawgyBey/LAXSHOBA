import useDocumentTitle from '../hooks/useDocumentTitle';
import usePageSEO from '../hooks/usePageSEO';
import useHomepageContent from '../hooks/useHomepageContent';
import { DEFAULT_ABOUT_TEXT, PLACEHOLDER } from '../lib/constants';

export default function About() {
  useDocumentTitle('About Us — LAXSHOBHA');
  usePageSEO('about', 'About Us — LAXSHOBHA', 'Learn more about LAXSHOBHA, draped in beauty.');
  const content = useHomepageContent();

  return (
    <section className="section">
      <div className="container about-split">
        <img src={content?.aboutImage || PLACEHOLDER.about} alt="The woman behind the boutique" />
        <div className="about-copy">
          <h1>Our Story</h1>
          <p>{content?.aboutText || DEFAULT_ABOUT_TEXT}</p>
        </div>
      </div>
    </section>
  );
}
