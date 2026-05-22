package com.interpaper.library.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.interpaper.library.domain.Book;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 슬라이드 아웃 상세 영역용 DTO. 책 본문 + 대댓글 트리(루트 목록)를 담는다.
 */
public record BookDetailResponse(
        Long id,
        String title,
        String introduction,
        String authorNote,
        String imagePath,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul") LocalDateTime createdAt,
        int commentCount,
        List<CommentResponse> comments
) {
    public static BookDetailResponse of(Book book, int commentCount, List<CommentResponse> rootComments) {
        return new BookDetailResponse(
                book.getId(),
                book.getTitle(),
                book.getIntroduction(),
                book.getAuthorNote(),
                book.getImagePath(),
                book.getCreatedAt(),
                commentCount,
                rootComments
        );
    }
}
