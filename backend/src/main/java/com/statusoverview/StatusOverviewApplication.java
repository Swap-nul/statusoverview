package com.statusoverview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class StatusOverviewApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(StatusOverviewApplication.class, args);
    }
}
