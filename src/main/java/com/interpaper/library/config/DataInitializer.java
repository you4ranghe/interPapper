package com.interpaper.library.config;

import com.interpaper.library.domain.Book;
import com.interpaper.library.domain.Comment;
import com.interpaper.library.repository.BookRepository;
import com.interpaper.library.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 애플리케이션 기동 시 가상 책 3권 + 꼬리에 꼬리를 무는(부모-자식-손자) 샘플 대댓글을 적재한다.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final CommentRepository commentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (bookRepository.count() > 0) {
            return; // 이미 적재됨
        }

        Book book1 = bookRepository.save(Book.builder()
                .title("바람이 머무는 서재")
                .introduction("오랜 시간 글을 다듬어 온 저자가, 일상의 작은 풍경 속에서 길어 올린 사유를 담담히 풀어낸 산문집입니다. "
                        + "한 장 한 장 넘길 때마다 원목 책상 위의 차 한 잔처럼 마음이 가라앉습니다.")
                .authorNote("창을 두드리는 바람 소리에 펜을 멈추는 저녁이 좋았습니다. 이 책의 문장들은 대부분 그런 저녁에 태어났습니다. "
                        + "서두르지 마시고, 바람이 머무는 만큼만 천천히 읽어 주세요.\n\n— 저자 드림")
                .imagePath("/images/book1.svg")
                .build());

        Book book2 = bookRepository.save(Book.builder()
                .title("문장의 결을 따라")
                .introduction("좋은 문장은 어떻게 만들어지는가. 수십 년간 글을 써 온 저자가 자신의 퇴고 노트를 공개하며 "
                        + "글쓰기의 호흡과 리듬, 그리고 단어를 고르는 마음가짐을 조곤조곤 들려줍니다.")
                .authorNote("문장은 깎을수록 단단해진다고 믿습니다. 수십 번을 고쳐 쓴 흔적들이 누군가의 첫 문장에 작은 용기가 되기를. "
                        + "결을 따라 천천히 쓰다 보면, 어느새 자신의 목소리를 만나게 될 겁니다.\n\n— 저자 드림")
                .imagePath("/images/book2.svg")
                .build());

        Book book3 = bookRepository.save(Book.builder()
                .title("아버지의 사계")
                .introduction("봄, 여름, 가을, 겨울 — 계절을 따라 흘러간 한 가족의 기록. 가장 가까웠으나 가장 말이 적었던 "
                        + "아버지의 시선으로, 지나온 시간들을 따뜻하게 되짚는 회고 에세이입니다.")
                .authorNote("끝내 입 밖으로 꺼내지 못한 말들을 이 책에 담았습니다. 사계가 한 바퀴를 도는 동안, "
                        + "우리는 서로를 조금 더 이해하게 되었지요. 가족이라는 이름에게 이 글을 바칩니다.\n\n— 저자 드림")
                .imagePath("/images/book3.svg")
                .build());

        // book1: 부모 -> 자식 -> 손자 (깊이 3)
        Comment root = commentRepository.save(Comment.builder()
                .book(book1).nickname("독자 김민준")
                .content("첫 산문집부터 정주행했습니다. 이번 책 정말 잘 읽었습니다, 선생님!")
                .build());

        Comment child = commentRepository.save(Comment.builder()
                .book(book1).nickname("저자")
                .content("따뜻한 말씀 감사합니다. 다음 책도 곧 찾아뵙겠습니다.")
                .parent(root)
                .build());

        commentRepository.save(Comment.builder()
                .book(book1).nickname("독자 김민준")
                .content("기다리고 있겠습니다. 건강 잘 챙기세요!")
                .parent(child)
                .build());

        commentRepository.save(Comment.builder()
                .book(book1).nickname("이서연")
                .content("'바람이 머무는 서재'라는 제목이 책 전체를 관통하네요. 표지도 너무 좋아요.")
                .build());

        // book2: 부모 -> 자식
        Comment c2root = commentRepository.save(Comment.builder()
                .book(book2).nickname("글쓰기 지망생")
                .content("퇴고 노트 부분이 특히 인상 깊었습니다. 혹시 손글씨 노트도 공개될까요?")
                .build());

        commentRepository.save(Comment.builder()
                .book(book2).nickname("저자")
                .content("기회가 된다면 부록으로 정리해 보겠습니다. 좋은 제안 고맙습니다.")
                .parent(c2root)
                .build());

        // book3: 루트 댓글
        commentRepository.save(Comment.builder()
                .book(book3).nickname("막내딸")
                .content("아빠 책, 가족 모두 울면서 읽었어요. 사랑합니다.")
                .build());
    }
}
