package com.interpaper.library.repository;

import com.interpaper.library.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * 특정 책의 모든 댓글을 부모/자식까지 한 번에 로딩한다.
     * 트리 구성은 서비스 계층에서 메모리 상에서 수행하므로,
     * N+1 을 피하기 위해 parent 를 fetch join 하고 작성순으로 정렬한다.
     */
    @Query("select c from Comment c left join fetch c.parent " +
            "where c.book.id = :bookId order by c.createdAt asc, c.id asc")
    List<Comment> findAllByBookIdWithParent(Long bookId);
}
