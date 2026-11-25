import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import usePageSEO from '../hooks/usePageSEO';
import useHomepageContent from '../hooks/useHomepageContent';
import { DEFAULT_ABOUT_TEXT } from '../lib/constants';

export default function About() {
  useDocumentTitle('About Us — LAXSHOBHA');
  usePageSEO('about', 'About Us — LAXSHOBHA', 'Learn more about LAXSHOBHA, draped in beauty.');
  const content = useHomepageContent();

  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container about-hero-grid">
          <div className="about-hero-copy">
            <p className="eyebrow">Meet the woman behind the label</p>
            <h1>Draped in beauty,<br />made for <em>your</em> story.</h1>
            <p className="about-hero-lead">A celebration of Indian craft, effortless elegance and the confidence every woman carries within.</p>
            <Link className="btn btn-primary" to="/shop">Explore the collection</Link>
          </div>
          <div className="about-portrait">
            <span className="about-portrait-frame" aria-hidden="true" />
            <img src={content?.aboutImage || '/profile.png'} alt="The woman behind LAXSHOBHA" />
            <span className="about-portrait-caption">Creating beauty for over seven years</span>
          </div>
        </div>
      </section>

      <section className="about-story section">
        <div className="container about-story-grid">
          <p className="about-story-kicker">Our story</p>
          <div className="about-copy">
            <h2>Clothes that feel like you.</h2>
            <p>{content?.aboutText || DEFAULT_ABOUT_TEXT}</p>
          </div>
        </div>
      </section>

      <section className="about-values section">
        <div className="container">
          <div className="about-values-head">
            <p className="eyebrow">The Laxshobha promise</p>
            <h2>Considered in every detail</h2>
          </div>
          <div className="about-values-grid">
            <article><span>01</span><h3>Thoughtfully chosen</h3><p>Pieces selected for graceful silhouettes, beautiful colour and everyday wearability.</p></article>
            <article><span>02</span><h3>Craft with character</h3><p>Celebrating texture, print and traditional detail through a fresh, modern lens.</p></article>
            <article><span>03</span><h3>Made to celebrate</h3><p>From quiet moments to grand occasions, find an outfit for the way you want to feel.</p></article>
          </div>
        </div>
      </section>

      <section className="about-signoff">
        <div className="container">
          <p>Find your next favourite</p>
          <h2>Dress beautifully. Live beautifully.</h2>
          <Link className="btn btn-gold" to="/shop">Shop Laxshobha</Link>
        </div>
      </section>
    </main>
  );
}
