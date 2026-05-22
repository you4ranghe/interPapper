package com.interpaper.library.controller;

import com.interpaper.library.dto.BookDetailResponse;
import com.interpaper.library.dto.BookSummaryResponse;
import com.interpaper.library.service.BookService;
import com.interpaper.library.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookApiController {

    private final BookService bookService;
    private final StorageService storageService;

    /** 책 목록 캐러셀 데이터 전체 조회 */
    @GetMapping
    public List<BookSummaryResponse> list() {
        return bookService.findAll();
    }

    /** 새 책 등록 — 표지 이미지 업로드(Multipart) 포함 */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookSummaryResponse> create(
            @RequestParam String title,
            @RequestParam String introduction,
            @RequestParam String authorNote,
            @RequestParam("cover") MultipartFile cover) {

        if (!StringUtils.hasText(title) || !StringUtils.hasText(introduction) || !StringUtils.hasText(authorNote)) {
            throw new IllegalArgumentException("제목, 소개글, 저자의 글을 모두 입력해 주세요.");
        }
        String imagePath = storageService.storeImage(cover);
        BookSummaryResponse created = bookService.create(title, introduction, authorNote, imagePath);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** 특정 책 상세 정보 및 대댓글 트리 조회 */
    @GetMapping("/{id}")
    public BookDetailResponse detail(@PathVariable Long id) {
        return bookService.findDetail(id);
    }
}
