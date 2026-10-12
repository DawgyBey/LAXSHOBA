import { api } from './api';
import { DEMO_PRODUCTS } from './constants';

export const getProducts = (published) => api.get(`/products${published ? '?published=true' : ''}`);
export const getProduct = (id) => api.get(`/products/${id}`);
export const getCategories = () => api.get('/categories');
export const getHomepage = () => api.get('/homepage');
export const getPage = (slug) => api.get(`/pages/${slug}`);
export const getCart = () => api.get('/me/cart');
export const saveCart = (items) => api.put('/me/cart', { items });
export const getWishlist = async () => {
	const result = await api.get('/me/wishlist');
	if (Array.isArray(result)) return result;
	const products = result.products || [];
	const savedIds = new Set(result.ids || products.map((product) => product.id));
	return [
		...products,
		...DEMO_PRODUCTS.filter((product) => savedIds.has(product.id)),
	];
};
export const saveWishlist = (productId, saved) => api.put(`/me/wishlist/${productId}`, { saved });
export const getAddresses = () => api.get('/me/addresses');
export const saveAddress = (address) => api.post('/me/addresses', address);
export const removeAddress = (id) => api.delete(`/me/addresses/${id}`);
export const getOrders = () => api.get('/me/orders');
export const saveOrder = (order) => api.post('/me/orders', order);
export const updateProfile = (profile) => api.patch('/me', profile);
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAdminProducts = () => api.get('/admin/products');
export const createProduct = (product) => api.post('/admin/products', product);
export const updateProduct = (id, product) => api.patch(`/admin/products/${id}`, product);
export const removeProduct = (id) => api.delete(`/admin/products/${id}`);
export const getAdminCategories = () => api.get('/admin/categories');
export const createCategory = (category) => api.post('/admin/categories', category);
export const removeCategory = (id) => api.delete(`/admin/categories/${id}`);
export const getAdminOrders = () => api.get('/admin/orders');
export const updateOrder = (id, status) => api.patch(`/admin/orders/${id}`, { status });
export const saveHomepage = (content) => api.put('/admin/homepage', content);
export const getAdminPages = () => api.get('/admin/pages');
export const createPage = (page) => api.post('/admin/pages', page);
export const updatePage = (id, page) => api.patch(`/admin/pages/${id}`, page);
export const removePage = (id) => api.delete(`/admin/pages/${id}`);
