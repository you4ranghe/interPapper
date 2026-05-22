package com.interpaper.library.service;

import com.interpaper.library.domain.Book;
import com.interpaper.library.domain.Comment;
import com.interpaper.library.dto.BookDetailResponse;
import com.interpaper.library.dto.BookSummaryResponse;
import com.interpaper.library.dto.CommentResponse;
import com.interpaper.library.repository.BookRepository;
import com.interpaper.library.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final CommentRepository commentRepository;

    /** 새 책 등록 (표지 경로는 업로드 후 결정된 값). */
    @Transactional
    public BookSummaryResponse create(String title, String introduction, String authorNote, String imagePath) {
        Book book = Book.builder()
                .title(title.trim())
                .introduction(introduction.trim())
                .authorNote(authorNote.trim())
                .imagePath(imagePath)
                .build();
        return BookSummaryResponse.from(bookRepository.save(book));
    }

    /** 캐러셀용 전체 책 목록 (최신순). */
    public List<BookSummaryResponse> findAll() {
        return bookRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt", "id")).stream()
                .map(BookSummaryResponse::from)
                .toList();
    }

    /** 책 상세 + 대댓글 트리. */
    public BookDetailResponse findDetail(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 책입니다. id=" + bookId));

        List<Comment> all = commentRepository.findAllByBookIdWithParent(bookId);
        List<CommentResponse> tree = buildTree(all);
        return BookDetailResponse.of(book, all.size(), tree);
    }

    /**
     * 평면 댓글 목록을 부모-자식 트리로 조립한다.
     * 조회 쿼리가 작성순(createdAt asc) 정렬을 보장하므로,
     * 부모는 자식보다 먼저 등장 → 단일 패스로 트리 구성 가능.
     */
    private List<CommentResponse> buildTree(List<Comment> comments) {
        Map<Long, CommentResponse> byId = new LinkedHashMap<>();
        List<CommentResponse> roots = new ArrayList<>();

        for (Comment c : comments) {
            CommentResponse node = CommentResponse.of(c, new ArrayList<>());
            byId.put(c.getId(), node);

            Long parentId = node.parentId();
            if (parentId == null) {
                roots.add(node);
            } else {
                CommentResponse parent = byId.get(parentId);
                if (parent != null) {
                    parent.children().add(node);
                } else {
                    // 부모가 (예외적으로) 먼저 로딩되지 않은 경우엔 루트로 취급
                    roots.add(node);
                }
            }
        }
        return roots;
    }
}
