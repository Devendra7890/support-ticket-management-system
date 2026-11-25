import { Router } from 'express';
import { createComment, getComments } from '../controllers/commentController.js';
import validate from '../middlewares/validate.js';
import {
  createCommentSchema,
  listCommentsQuerySchema,
} from '../validators/commentValidators.js';

const router = Router({ mergeParams: true });

router.post('/', validate(createCommentSchema), createComment);
router.get('/', validate(listCommentsQuerySchema, 'query'), getComments);

export default router;
