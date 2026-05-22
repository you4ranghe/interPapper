package com.interpaper.library.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.interpaper.library.domain.Comment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 대댓글 트리 응답 노드. children 으로 재귀 구조를 표현한다.
 * 엔티티를 직접 직렬화하지 않아 무한 순환/지연로딩 문제를 회피한다.
 */
public record CommentResponse(
        Long id,
        String nickname,
        String content,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul") LocalDateTime createdAt,
        Long parentId,
        List<CommentResponse> children
) {
    public static CommentResponse of(Comment comment, List<CommentResponse> children) {
        return new CommentResponse(
                comment.getId(),
                comment.getNickname(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getParent() == null ? null : comment.getParent().getId(),
                children == null ? new ArrayList<>() : children
        );
    }
}
