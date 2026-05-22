package com.interpaper.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 댓글/대댓글 등록 요청. parentId 가 있으면 대댓글, 없으면 최상위 댓글.
 */
public record CommentCreateRequest(
        @NotNull Long bookId,
        @NotBlank @Size(max = 50) String nickname,
        @NotBlank @Size(max = 2000) String content,
        Long parentId
) {
}
