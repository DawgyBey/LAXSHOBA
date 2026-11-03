import useDocumentTitle from '../hooks/useDocumentTitle';
import usePageSEO from '../hooks/usePageSEO';
import useHomepageContent from '../hooks/useHomepageContent';
import { DEFAULT_ABOUT_TEXT } from '../lib/constants';

export default function About() {
  useDocumentTitle('About Us — LAXSHOBHA');
  usePageSEO('about', 'About Us — LAXSHOBHA', 'Learn more about LAXSHOBHA, draped in beauty.');
  const content = useHomepageContent();

  return (
    <section className="section">
      <div className="container about-split">
        <div className="story-photo">
          <img src={content?.aboutImage || '/profile.png'} alt="The woman behind LAXSHOBHA" />
        </div>
        <div className="about-copy">
          <h1>Our Story</h1>
          <p className="eyebrow-plain">The face behind LAXSHOBHA for more than seven years.</p>
          <p>{content?.aboutText || DEFAULT_ABOUT_TEXT}</p>
        </div>
      </div>
    </section>
  );
}
