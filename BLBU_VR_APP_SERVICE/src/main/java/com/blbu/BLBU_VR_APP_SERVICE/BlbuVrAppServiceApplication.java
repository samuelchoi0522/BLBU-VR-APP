package com.blbu.BLBU_VR_APP_SERVICE;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@SpringBootApplication(scanBasePackages = "com.blbu.BLBU_VR_APP_SERVICE")
@EnableJpaRepositories(basePackages = "com.blbu.BLBU_VR_APP_SERVICE.repository")
@EntityScan(basePackages = "com.blbu.BLBU_VR_APP_SERVICE.model")
public class BlbuVrAppServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlbuVrAppServiceApplication.class, args);
	}
}
