package com.interpaper.library.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 토론장 댓글. 셀프 참조(parent/children)로 무한 계층 대댓글 트리를 구성한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 부모 댓글. 최상위 댓글이면 null. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    /** 자식(대)댓글 목록. */
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> children = new ArrayList<>();

    @Builder
    public Comment(Book book, String nickname, String content, Comment parent) {
        this.book = book;
        this.nickname = nickname;
        this.content = content;
        this.parent = parent;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    /** 연관관계 편의 메서드: 자식 댓글을 추가하면서 부모도 함께 설정한다. */
    public void addChild(Comment child) {
        this.children.add(child);
        child.assignParent(this);
    }

    void assignParent(Comment parent) {
        this.parent = parent;
    }

    public boolean isRoot() {
        return this.parent == null;
    }
}
