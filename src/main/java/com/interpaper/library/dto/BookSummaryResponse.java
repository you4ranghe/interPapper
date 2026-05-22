package com.interpaper.library.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.interpaper.library.domain.Book;

import java.time.LocalDateTime;

/**
 * 캐러셀 목록용 책 요약 DTO. (소개 본문/댓글 제외)
 */
public record BookSummaryResponse(
        Long id,
        String title,
        String imagePath,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul") LocalDateTime createdAt
) {
    public static BookSummaryResponse from(Book book) {
        return new BookSummaryResponse(
                book.getId(),
                book.getTitle(),
                book.getImagePath(),
                book.getCreatedAt()
        );
    }
}
