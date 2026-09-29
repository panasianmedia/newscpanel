/**
 * social-post service
 */

import publisher from './publisher';
import { renderBrandedImage } from './media-renderer';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export default ({ strapi }: { strapi: any }) => ({
  async dispatch(socialPostId: number | string) {
    const post = await strapi.entityService.findOne('api::social-post.social-post', socialPostId, {
      populate: {
        custom_media: true,
        article: {
          populate: {
            Image: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error(`Social post ${socialPostId} not found.`);
    }
    if (post.status === 'posted') {
      return post;
    }

    let article = post.article;
    if (!article) {
      const [latestArticle] = await strapi.entityService.findMany('api::article.article', {
        filters: { publishedAt: { $notNull: true } },
        sort: { publishedAt: 'desc' },
        limit: 1,
        populate: { Image: true },
      });
      article = latestArticle;
    }

    const mediaObj = post.custom_media || article?.Image;
    let imageUrl = mediaObj?.url;

    if (imageUrl && !imageUrl.startsWith('http')) {
      const publicBase = process.env.PUBLIC_MEDIA_URL || process.env.STRAPI_URL || '';
      imageUrl = `${publicBase.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`;
    }

    const articleUrl = article?.Slug
      ? `${(process.env.FRONTEND_PUBLIC_URL || '').replace(/\/$/, '')}/news/${article.Slug}`
      : process.env.FRONTEND_PUBLIC_URL || '';

    const fallbackText = article?.Caption || article?.Title || '';
    let renderedMedia: Awaited<ReturnType<typeof renderBrandedImage>> | undefined;
    let uploadedMediaUrl = imageUrl;
    const framePath = process.env.SOCIAL_FRAME_PATH || join(process.cwd(), 'public', 'frame.png');

    if (imageUrl && article?.Title && existsSync(framePath)) {
      renderedMedia = await renderBrandedImage(imageUrl, article.Title, framePath);
      try {
        const [uploadedMedia] = await strapi.plugin('upload').service('upload').upload({
          data: {
            fileInfo: {
              name: `social-${article.Slug || socialPostId}`,
              alternativeText: article.Title,
              caption: fallbackText,
            },
          },
          files: {
            filepath: renderedMedia.filePath,
            originalFileName: `social-${socialPostId}.jpg`,
            mimetype: 'image/jpeg',
            size: renderedMedia.size,
          },
        });
        uploadedMediaUrl = uploadedMedia.url;
        if (uploadedMediaUrl && !uploadedMediaUrl.startsWith('http')) {
          const publicBase = process.env.PUBLIC_MEDIA_URL || process.env.STRAPI_URL || '';
          uploadedMediaUrl = `${publicBase.replace(/\/$/, '')}/${uploadedMediaUrl.replace(/^\//, '')}`;
        }
      } finally {
        await renderedMedia.cleanup();
      }
    }

    const payload = {
      platforms: post.platforms || [],
      articleUrl,
      imageUrl: uploadedMediaUrl,
      article: {
        slug: article?.Slug,
        title: article?.Title,
        excerpt: article?.Caption,
        coverImage: mediaObj,
      },
      caption_facebook: post.caption_facebook || fallbackText,
      caption_instagram: post.caption_instagram || fallbackText,
      caption_linkedin: post.caption_linkedin || fallbackText,
    };

    const results = await publisher().dispatch(payload);

    const selectedPlatforms: string[] = post.platforms || [];
    const isSuccess =
      selectedPlatforms.length > 0 &&
      selectedPlatforms.every((platform) => results.successes.includes(platform));

    return await strapi.entityService.update('api::social-post.social-post', socialPostId, {
      data: {
        status: isSuccess ? 'posted' : 'failed',
        error_log: results,
        posted_at: isSuccess ? new Date().toISOString() : null,
      },
    });
  },
});