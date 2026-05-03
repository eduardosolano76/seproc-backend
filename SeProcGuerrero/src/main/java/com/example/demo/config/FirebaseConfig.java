package com.example.demo.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

	@Value("${FIREBASE_SERVICE_ACCOUNT}")
	private Resource serviceAccount;

	@Value("${FIREBASE_STORAGE_BUCKET}")
	private String storageBucket;

	@PostConstruct
	public void init() throws IOException {
		if (FirebaseApp.getApps().isEmpty()) {
			FirebaseOptions options = FirebaseOptions.builder()
				.setCredentials(GoogleCredentials.fromStream(serviceAccount.getInputStream()))
				.setStorageBucket(storageBucket)
				.build();

			FirebaseApp.initializeApp(options);
		}
	}

}