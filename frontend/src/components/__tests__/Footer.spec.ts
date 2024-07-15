import { render, screen } from '@testing-library/vue';
import Footer from '../Footer.vue';
import { describe, it, expect } from 'vitest';

const wrappedRender = async () => {
  return render(Footer);
};

const links = [
  { id: 'footer-link-home', label: 'Home', to: 'https://www.gov.bc.ca/' },
  {
    id: 'footer-link-about',
    label: 'About gov.bc.ca',
    to: 'https://www2.gov.bc.ca/gov/content/about-gov-bc-ca',
  },
  {
    id: 'footer-link-disclaimer',
    label: 'Disclaimer',
    to: 'https://www.gov.bc.ca/disclaimer',
  },
  {
    id: 'footer-link-privacy',
    label: 'Privacy',
    to: 'https://www.gov.bc.ca/privacy',
  },
  {
    id: 'footer-link-accessibility',
    label: 'Accessibility',
    to: 'https://www.gov.bc.ca/webaccessibility',
  },
  {
    id: 'footer-link-copyright',
    label: 'Copyright',
    to: 'https://www.gov.bc.ca/copyright',
  },
  {
    id: 'footer-link-contact-us',
    label: 'Contact Us',
    to: 'https://www2.gov.bc.ca/gov/content/home/contact-us',
  },
];

describe('Footer', () => {
  it('should display the correct message', () => {
    wrappedRender();
    expect(screen.getByTestId('footer-message')).toHaveTextContent(
      'For questions or assistance with creating a report please contact the Pay Transparency Unit - PayTransparency@gov.bc.ca',
    );
  });

  it('should display links', () => {
    wrappedRender();

    links.forEach((link) => {
      const linkElement = screen.getByTestId(link.id);
      expect(linkElement).toHaveTextContent(link.label);
      expect(linkElement).toHaveAttribute('href');
    });
  });
});
