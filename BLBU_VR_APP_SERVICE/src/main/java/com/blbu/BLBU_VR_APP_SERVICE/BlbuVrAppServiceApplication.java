package com.blbu.BLBU_VR_APP_SERVICE;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class BlbuVrAppServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlbuVrAppServiceApplication.class, args);
	}

	@GetMapping("/health")
	public String healthCheck() {
		return "BLBU VR App Service is healthy";
	}
}
