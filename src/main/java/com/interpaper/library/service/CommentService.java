package com.interpaper.library.service;

import com.interpaper.library.domain.Book;
import com.interpaper.library.domain.Comment;
import com.interpaper.library.dto.CommentCreateRequest;
import com.interpaper.library.dto.CommentResponse;
import com.interpaper.library.repository.BookRepository;
import com.interpaper.library.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final BookRepository bookRepository;
    private final CommentRepository commentRepository;

    /** 댓글/대댓글 등록 후, 생성된 노드를 응답 DTO 로 반환. */
    public CommentResponse create(CommentCreateRequest request) {
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 책입니다. id=" + request.bookId()));

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부모 댓글입니다. id=" + request.parentId()));
            if (!parent.getBook().getId().equals(book.getId())) {
                throw new IllegalArgumentException("부모 댓글이 다른 책에 속해 있습니다.");
            }
        }

        Comment comment = Comment.builder()
                .book(book)
                .nickname(request.nickname().trim())
                .content(request.content().trim())
                .parent(parent)
                .build();

        Comment saved = commentRepository.save(comment);
        return CommentResponse.of(saved, new ArrayList<>());
    }
}
