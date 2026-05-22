package com.interpaper.library;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class InterpaperApplication {

    public static void main(String[] args) {
        SpringApplication.run(InterpaperApplication.class, args);
    }

    /**
     * 모든 서버 동작(JVM 기본 시각)을 Asia/Seoul 기준으로 고정한다.
     * Jackson 직렬화 타임존은 application.yml 의 spring.jackson.time-zone 에서 별도 지정.
     */
    @PostConstruct
    void setDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }
}
