import type { Comment, LiveStats, Product } from './types';

/** Entirely invented fixtures. No IDs or content from the reference service. */
export const mockAccountId = 'demo-account-1';
export const mockLiveSessionId = 'demo-live-1';

export const mockStats: LiveStats = {
  accountId: mockAccountId,
  liveSessionId: mockLiveSessionId,
  capturedAt: '2026-01-01T12:00:00.000Z',
  viewers: 128,
  sold: 19,
  likes: 642,
  comments: 27,
  enters: 315,
  impressions: 1800,
  gmv: 2350,
  gmvPerHour: 1175,
  impressionsPerHour: 900,
  currency: 'THB',
};

export const mockProducts: readonly Product[] = [
  { id: 'demo-product-1', title: 'Demo Canvas Tote', price: 290, currency: 'THB' },
  { id: 'demo-product-2', title: 'Demo Water Bottle', price: 390, currency: 'THB' },
  { id: 'demo-product-3', title: 'Demo Notebook', price: 180, currency: 'THB' },
];

export const mockComments: readonly Comment[] = [
  {
    id: 'demo-comment-1',
    liveSessionId: mockLiveSessionId,
    authorId: 'demo-viewer-1',
    authorName: 'Sample Viewer',
    text: 'มีสีอื่นไหมคะ',
    createdAt: '2026-01-01T12:00:01.000Z',
  },
  {
    id: 'demo-comment-2',
    liveSessionId: mockLiveSessionId,
    authorId: 'demo-viewer-2',
    authorName: 'Example Buyer',
    text: 'ขอดูสินค้าชิ้นแรกหน่อยครับ',
    createdAt: '2026-01-01T12:00:03.000Z',
  },
];
