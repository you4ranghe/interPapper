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
 * 아버님의 저서 한 권. LP 자켓(Sleeve)에 해당한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Lob
    @Column(nullable = false)
    private String introduction;

    /** 저자가 직접 남긴 짧은 글(헌사/소회). */
    @Lob
    @Column(nullable = false)
    private String authorNote;

    /** 표지 이미지 경로 (정적 리소스 또는 업로드 경로) */
    @Column(nullable = false)
    private String imagePath;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Builder
    public Book(String title, String introduction, String authorNote, String imagePath) {
        this.title = title;
        this.introduction = introduction;
        this.authorNote = authorNote;
        this.imagePath = imagePath;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
