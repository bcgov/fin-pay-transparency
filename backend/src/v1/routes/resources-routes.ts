import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../../logger.js';
import { announcementService } from '../services/announcements-service.js';

const ResourceDownloadParamsSchema = z.object({
  id: z.string().nonempty(),
});

const router = Router();
router.get('/:id', async (req: Request, res: Response) => {
  const validationResult = ResourceDownloadParamsSchema.safeParse(req.params);
  const id = validationResult.data.id;
  let resource: Awaited<
    ReturnType<typeof announcementService.getAnnouncementResource>
  >;

  try {
    resource = await announcementService.getAnnouncementResource(id);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: 'Could not send file.' });
    return;
  }

  res.setHeader('Content-Disposition', `inline; filename=${resource.filename}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  if (resource.contentLength) {
    res.setHeader('Content-Length', resource.contentLength);
  }
  resource.data.on('error', (err) => {
    logger.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Could not send file.' });
    }
  });

  resource.data.pipe(res);
});

export default router;
