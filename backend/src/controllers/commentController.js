import * as commentService from '../services/commentService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(
    req.params.id,
    req.user,
    req.body.message
  );

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment },
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const result = await commentService.listComments(
    req.params.id,
    req.user,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    message: 'Comments retrieved successfully',
    data: result,
  });
});
