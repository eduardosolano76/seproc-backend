package com.example.demo.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.storage.base-path:uploads}")
	private String basePath;

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		Path uploadDir = Paths.get(basePath).toAbsolutePath().normalize();
		registry.addResourceHandler("/uploads/**").addResourceLocations("file:" + uploadDir.toString() + "/");
	}

}
