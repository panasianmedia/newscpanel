export default {
  routes: [
    {
      method: 'POST',
      path: '/social-posts/:id/dispatch',
      handler: 'social-post.dispatchPost',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-posts',
      handler: 'social-post.find',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/social-posts/:id',
      handler: 'social-post.findOne',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/social-posts',
      handler: 'social-post.create',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/social-posts/:id',
      handler: 'social-post.update',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/social-posts/:id',
      handler: 'social-post.delete',
      config: { policies: [], middlewares: [] },
    },
  ],
};