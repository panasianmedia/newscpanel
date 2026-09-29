const pendingArticleIds = new Set<string>();

function queueSocialPost(article: any) {
  if (!article?.id || !article.publishedAt) return;

  const articleId = String(article.id);
  if (pendingArticleIds.has(articleId)) return;
  pendingArticleIds.add(articleId);

  setImmediate(async () => {
    try {
      const [existingPost] = await strapi.entityService.findMany(
        'api::social-post.social-post',
        {
          filters: { article: { id: { $eq: article.id } } },
          fields: ['id'],
          limit: 1,
        },
      );

      if (existingPost) return;

      await strapi.entityService.create('api::social-post.social-post', {
        data: {
          article: article.id,
          platforms: ['instagram', 'facebook'] as any,
          status: 'ready_to_post',
        },
      });
    } catch (error) {
      strapi.log.error(`[Article Social Publisher] Error for article ${articleId}:`, error);
    } finally {
      pendingArticleIds.delete(articleId);
    }
  });
}

export default {
  afterCreate(event: any) {
    queueSocialPost(event.result);
  },

  afterUpdate(event: any) {
    queueSocialPost(event.result);
  },
};