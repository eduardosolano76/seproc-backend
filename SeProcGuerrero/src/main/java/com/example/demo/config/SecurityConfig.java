package com.example.demo.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.demo.security.AdminSistemaDetailsService;
import com.example.demo.security.CustomUserDetailsService;
import com.example.demo.security.RoleRedirectSuccessHandler;
import com.example.demo.security.TenantLogoutSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	// Zona super ADMIN (Prioridad 1 - Totalmente Aislada)
	@Bean
	@Order(1)
	SecurityFilterChain superAdminFilterChain(
	        HttpSecurity http,
	        AdminSistemaDetailsService adminSistemaDetailsService,
	        PasswordEncoder passwordEncoder
	) throws Exception {

	    DaoAuthenticationProvider superAdminProvider =
	            new DaoAuthenticationProvider(adminSistemaDetailsService);

	    superAdminProvider.setPasswordEncoder(passwordEncoder);

	    http
	        // Protege las rutas
	        .securityMatcher("/api/admin-seproc/**")

	        // Provider exclusivo para el Súper Admin
	        .authenticationProvider(superAdminProvider)

	        // CORS para permitir llamadas desde Angular
	        .cors(cors -> cors.configurationSource(corsConfigurationSource()))

	        // Ignoramos CSRF solo para la API que consumirá Angular
	        .csrf(csrf -> csrf
	            .ignoringRequestMatchers("/api/admin-seproc/**")
	        )

	        .authorizeHttpRequests(auth -> auth

	            // Login público para Angular
	            .requestMatchers("/api/admin-seproc/login").permitAll()

	            // Recursos estáticos
	            .requestMatchers(
	                "/assets/**",
	                "/css/**",
	                "/js/**",
	                "/images/**",
	                "/static/**"
	            ).permitAll()

	            // Todo lo demás de admin-seproc requiere SUPERADMIN
	            .anyRequest().hasRole("SUPERADMIN")
	        )

	        .formLogin(form -> form

	            .loginProcessingUrl("/api/admin-seproc/login")

	            // Si el login es correcto, regresamos JSON
	            .successHandler((request, response, authentication) -> {
	                response.setStatus(200);
	                response.setContentType("application/json;charset=UTF-8");
	                response.getWriter().write("{\"mensaje\":\"Login correcto\"}");
	            })

	            // Si falla, regresamos error JSON
	            .failureHandler((request, response, exception) -> {
	                response.setStatus(401);
	                response.setContentType("application/json;charset=UTF-8");
	                response.getWriter().write("{\"mensaje\":\"Usuario o contraseña incorrectos\"}");
	                response.getWriter().flush();
	            })

	            .permitAll()
	        )

	        .logout(logout -> logout

	            // Esta es la URL que Angular debe llamar para cerrar sesión
	            .logoutUrl("/api/admin-seproc/logout")

	            .logoutSuccessHandler((request, response, authentication) -> {
	                response.setStatus(200);
	                response.setContentType("application/json;charset=UTF-8");
	                response.getWriter().write("{\"mensaje\":\"Sesión cerrada correctamente\"}");
	                response.getWriter().flush();
	            })

	            .permitAll()
	        );

	    return http.build();
	}

	@Bean
	@Order(2)
	SecurityFilterChain securityFilterChain(HttpSecurity http, RoleRedirectSuccessHandler successHandler,
			CustomUserDetailsService customUserDetailsService, PasswordEncoder passwordEncoder,
			TenantFilter tenantFilter, TenantLogoutSuccessHandler logoutHandler) throws Exception {

		// EXPLÍCITAMENTE para los clientes
		DaoAuthenticationProvider clientProvider = new DaoAuthenticationProvider(customUserDetailsService);
		clientProvider.setPasswordEncoder(passwordEncoder);

		http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.csrf(csrf -> csrf.ignoringRequestMatchers("/api/**")).authenticationProvider(clientProvider)
				.addFilterAfter(tenantFilter, UsernamePasswordAuthenticationFilter.class)
				.authorizeHttpRequests(auth -> auth
						// ESTÁTICOS
						.requestMatchers("/assets/**", "/css/**", "/js/**", "/images/**", "/static/**", "/uploads/**")
						.permitAll()

						// PÚBLICOS
						.requestMatchers("/", "/login", "/login/**", "/auth/**", "/public/**", "/registro/**",
								"/api/seproc/**")
						.permitAll()

						// MÓDULOS POR ROL
						.requestMatchers("/admin", "/admin/**").hasRole("ADMINISTRADOR")
						.requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")

						.requestMatchers("/constructor", "/constructor/**").hasRole("CONTRATISTA")
						.requestMatchers("/api/constructor/**").hasRole("CONTRATISTA")

						.requestMatchers("/supervisor", "/supervisor/**").hasRole("SUPERVISOR")
						.requestMatchers("/api/supervisor/**").hasRole("SUPERVISOR")

						.requestMatchers("/central", "/central/**").hasRole("CENTRAL")
						.requestMatchers("/api/central/**").hasRole("CENTRAL")

						.requestMatchers("/direccion", "/direccion/**").hasRole("DIRECCION")
						.requestMatchers("/api/direccion/**").hasRole("DIRECCION")

						.anyRequest().authenticated())
				.formLogin(form -> form.loginPage("/login").loginProcessingUrl("/login").successHandler(successHandler)
						.failureHandler((request, response, exception) -> {

							// 1. Leemos la empresa que mandamos oculta en el HTML
							String empresa = request.getParameter("empresa");
							String redirectUrl = "/login"; // Ruta por defecto (genérica)

							// 2. Si venía de una empresa, armamos la URL dinámica
							if (empresa != null && !empresa.trim().isEmpty()) {
								redirectUrl = "/login/" + empresa.trim().toLowerCase();
							}

							// 3. Redirigimos con el error correspondiente a la URL que armamos
							if (exception instanceof org.springframework.security.authentication.DisabledException) {
								response.sendRedirect(redirectUrl + "?pending=true");
							} else {
								response.sendRedirect(redirectUrl + "?error=true");
							}
						}).permitAll())
				.logout(logout -> logout.logoutUrl("/logout").logoutSuccessHandler(logoutHandler).permitAll());

		return http.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();

		configuration.setAllowedOrigins(List.of("http://localhost:4200", "http://127.0.0.1:4200"));

		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

		configuration.setAllowedHeaders(List.of("*"));

		configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));

		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);

		return source;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}