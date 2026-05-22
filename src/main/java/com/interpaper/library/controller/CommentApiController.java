package com.interpaper.library.controller;

import com.interpaper.library.dto.CommentCreateRequest;
import com.interpaper.library.dto.CommentResponse;
import com.interpaper.library.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentApiController {

    private final CommentService commentService;

    /** 특정 책에 댓글/대댓글 등록 (JSON 응답) */
    @PostMapping
    public ResponseEntity<CommentResponse> create(@Valid @RequestBody CommentCreateRequest request) {
        CommentResponse created = commentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
