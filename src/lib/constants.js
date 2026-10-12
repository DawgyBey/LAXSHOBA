export const PLACEHOLDER = {
  product: '/images/placeholder-product.svg',
  category: '/images/placeholder-category.svg',
  hero: '/images/placeholder-hero.svg',
  about: '/images/placeholder-about.svg',
  avatar: '/images/placeholder-avatar.svg',
};

export const BRAND_NAME = 'LAXSHOBHA';
export const BRAND_TAGLINE = 'Draped in Beauty';
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/laxshobha',
};

// Put an editorial photo of a model in /public/photos and point this at it,
// or set the Hero Image URL in Admin > Homepage & Settings.
export const DEFAULT_HERO_IMAGE = '/images/placeholder-hero.jpeg';

export const DEMO_PRODUCTS = [
  {
    id: 'demo-pink-embroidered-kurta',
    name: 'Blush Pink Embroidered Kurta Set',
    price: 3490,
    salePrice: 2990,
    images: [
      '/photos/blush-pink-flatlay.jpg',
    ],
    description: 'A soft blush-pink three-piece set with delicate floral embroidery, a flowing dupatta, and an easy straight-cut silhouette.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink'],
    categorySlug: 'kurtas',
    occasion: ['Festive', 'Party', 'Wedding'],
    fabric: 'Textured cotton blend',
    care: 'Gentle hand wash separately. Dry in shade.',
    highlights: ['Embroidered kurta, trousers and dupatta', 'Scalloped dupatta border', 'Comfortable straight fit'],
    stock: 12,
    isHotPick: true,
    published: true,
  },
  {
    id: 'demo-olive-embroidered-kurta',
    name: 'Olive Bloom Kurta Set',
    price: 2890,
    images: ['/photos/olive-bloom.jpg'],
    description: 'An olive-green kurta set dotted with tiny blooms and finished with refined ladder embroidery around the neckline and cuffs.',
    sizes: ['S', 'M', 'L'],
    colors: ['Green'],
    categorySlug: 'kurtas',
    occasion: ['Everyday', 'Office', 'Festive'],
    fabric: 'Cotton silk blend',
    care: 'Hand wash cold. Iron on reverse side.',
    highlights: ['Subtle floral embroidery', 'Wide-leg trousers', 'Lightweight matching dupatta'],
    stock: 8,
    isHotPick: true,
    published: true,
  },
  {
    id: 'demo-crimson-embroidered-kurta',
    name: 'Crimson Garden Kurta Set',
    price: 3290,
    salePrice: 2890,
    images: ['/photos/crimson-garden.jpg'],
    description: 'A vivid crimson ensemble with ornate gold floral embroidery, made for celebrations that call for a little drama.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Red'],
    categorySlug: 'traditional-wear',
    occasion: ['Wedding', 'Festive', 'Party'],
    fabric: 'Silk blend',
    care: 'Dry clean recommended.',
    highlights: ['Gold embroidered neckline', 'Flowing dupatta with border', 'Wide-leg palazzo trousers'],
    stock: 6,
    isHotPick: true,
    published: true,
  },
  {
    id: 'demo-black-geometric-kurta',
    name: 'Noir Geometric Kurta Set',
    price: 2790,
    images: ['/photos/noir-geometric.jpg'],
    description: 'A sleek black kurta with a modern asymmetrical hem, pearl accents, and patterned palazzo trousers.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    categorySlug: 'traditional-wear',
    occasion: ['Party', 'Office', 'Festive'],
    fabric: 'Rayon blend',
    care: 'Gentle machine wash. Do not bleach.',
    highlights: ['Asymmetrical kurta hem', 'Statement patterned trousers', 'Contrast cuff embroidery'],
    stock: 9,
    isHotPick: false,
    published: true,
  },
  {
    id: 'demo-wine-geometric-kurta',
    name: 'Wine Patterned Kurta Set',
    price: 2790,
    images: ['/photos/wine-geometric.jpg'],
    description: 'A deep wine kurta set with diamond-patterned trousers, embroidered cuffs, and delicate pearl finishing.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Maroon'],
    categorySlug: 'traditional-wear',
    occasion: ['Festive', 'Party'],
    fabric: 'Rayon blend',
    care: 'Gentle machine wash. Dry flat.',
    highlights: ['Coordinated printed palazzos', 'Embroidered sleeve cuffs', 'Pearl tassel details'],
    stock: 7,
    isHotPick: true,
    published: true,
  },
  {
    id: 'demo-rust-floral-kurta',
    name: 'Rust Floral Embroidered Set',
    price: 2690,
    images: ['/photos/rust-floral.jpg'],
    description: 'A warm rust kurta set with hand-feel floral motifs, a tasselled neckline, and a softly draped dupatta.',
    sizes: ['S', 'M', 'L'],
    colors: ['Orange'],
    categorySlug: 'kurtas',
    occasion: ['Everyday', 'Festive'],
    fabric: 'Cotton blend',
    care: 'Hand wash separately in cold water.',
    highlights: ['Floral embroidered panels', 'Tassel neckline detail', 'Relaxed straight fit'],
    stock: 10,
    isHotPick: false,
    published: true,
  },
  {
    id: 'demo-pink-floral-kurta',
    name: 'Petal Pink Floral Kurta Set',
    price: 2590,
    images: ['/photos/petal-pink.jpg'],
    description: 'A light petal-pink set with all-over floral embroidery and a delicate border running along the dupatta.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink'],
    categorySlug: 'kurtas',
    occasion: ['Everyday', 'Office', 'Party'],
    fabric: 'Cotton voile',
    care: 'Hand wash cold and press lightly.',
    highlights: ['All-over floral embroidery', 'Matching wide-leg trousers', 'Soft lightweight dupatta'],
    stock: 11,
    isHotPick: false,
    published: true,
  },
  {
    id: 'demo-coral-floral-kurta',
    name: 'Coral Garden Kurta Set',
    price: 2690,
    images: ['/photos/coral-garden.jpg'],
    description: 'A coral-orange embroidered set with floral medallions and a coordinating dupatta for bright daytime occasions.',
    sizes: ['S', 'M', 'L'],
    colors: ['Orange'],
    categorySlug: 'kurtas',
    occasion: ['Everyday', 'Festive'],
    fabric: 'Cotton blend',
    care: 'Hand wash separately. Avoid soaking.',
    highlights: ['Embroidered floral medallions', 'Coordinated three-piece set', 'Easy relaxed fit'],
    stock: 8,
    isHotPick: false,
    published: true,
  },
  {
    id: 'demo-pink-floral-longline',
    name: 'Rosewater Floral Longline Set',
    price: 2990,
    images: ['/photos/petal-pink.jpg'],
    description: 'A romantic rosewater-pink longline kurta with vine embroidery, matching trousers, and a generous flowing dupatta.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink'],
    categorySlug: 'traditional-wear',
    occasion: ['Party', 'Festive', 'Wedding'],
    fabric: 'Lawn cotton',
    care: 'Gentle hand wash. Dry in shade.',
    highlights: ['Vine embroidery at neckline and hem', 'Longline silhouette', 'Floral bordered dupatta'],
    stock: 5,
    isHotPick: true,
    published: true,
  },
];

export const SIZES = ['S', 'M', 'L', 'XL', 'Free Size'];
export const COLORS = ['Red', 'Maroon', 'Pink', 'Orange', 'Gold', 'Green', 'Blue', 'Black'];
export const OCCASIONS = ['Everyday', 'Office', 'Festive', 'Wedding', 'Party'];
export const FABRICS = ['Cotton', 'Cotton blend', 'Cotton silk blend', 'Lawn cotton', 'Rayon blend', 'Silk blend', 'Textured cotton blend', 'Viscose'];
export const DEFAULT_CATEGORIES = [
  { name: 'Sarees', slug: 'sarees' },
  { name: 'Kurtas', slug: 'kurtas' },
  { name: 'Traditional Wear', slug: 'traditional-wear' },
];
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Sarees', to: '/shop?category=sarees', optional: true },
  { label: 'Kurtas', to: '/shop?category=kurtas', optional: true },
  { label: 'Traditional Wear', to: '/shop?category=traditional-wear', optional: true },
  { label: 'New Arrivals', to: '/shop?filter=new', optional: true },
  { label: 'Hot Picks', to: '/shop?filter=hot', optional: true },
  { label: 'About', to: '/about' },
  { label: 'Sale', to: '/shop?filter=sale', highlight: true },
];

export const DEFAULT_HERO = {
  title: 'Traditional elegance, chosen with love.',
  text: 'Every piece in this collection is picked and worn first by the woman who started it all.',
};

export const DEFAULT_ABOUT_TEXT =
  'This boutique began at home, with a love of sarees passed down and worn on every ' +
  'occasion that mattered. Every piece here has been chosen the same way — by hand, ' +
  'by eye, and by heart.';


// ---- Storefront copy (edit these to change the banners without touching components) ----
// Set a number (for example 5000) to show "Complimentary shipping on orders over Rs. 5,000"
// in the top bar. Leave as null until you have decided the real offer.
export const FREE_SHIPPING_THRESHOLD = null;

export const ANNOUNCEMENTS = [
  'Hand-selected traditional wear',
  'Cash on delivery available at checkout',
];

export const TRUST_POINTS = [
  { icon: 'cod', title: 'Cash on delivery', text: 'Pay when your order arrives.' },
  { icon: 'track', title: 'Track your orders', text: 'See every order status in your account.' },
  { icon: 'hand', title: 'Hand-picked pieces', text: 'Chosen and worn first by the founder.' },
  { icon: 'lock', title: 'One-tap sign in', text: 'Log in quickly with Google.' },
];

// Occasion tiles. `image` is any photo path or URL; `position` chooses which part is kept when cropped.
// Swap these for lifestyle photos of your own (put them in /public/photos).
export const OCCASION_STYLES = {
  Everyday: { image: '/photos/olive-bloom.jpg', position: '50% 38%', note: 'Easy, all-day dressing' },
  Office: { image: '/photos/noir-geometric.jpg', position: '50% 40%', note: 'Quietly polished' },
  Festive: { image: '/photos/coral-garden.jpg', position: '46% 45%', note: 'Made for celebrations' },
  Wedding: { image: '/photos/crimson-garden.jpg', position: '50% 42%', note: 'Dressed for the day' },
  Party: { image: '/photos/wine-geometric.jpg', position: '50% 40%', note: 'Ready for the evening' },
};
