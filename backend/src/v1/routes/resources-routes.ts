import { Router } from 'express';
import { downloadFile } from '../../external/services/s3-api';

const router = Router();
router.get('/:id', async (req, res) => {
  await downloadFile(res, req.params.id);
});

export default router;
