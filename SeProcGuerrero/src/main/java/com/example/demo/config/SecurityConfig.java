package com.example.demo.config;

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

import com.example.demo.security.AdminSistemaDetailsService;
import com.example.demo.security.CustomUserDetailsService;
import com.example.demo.security.RoleRedirectSuccessHandler;
import com.example.demo.security.TenantLogoutSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	// ZONA SÚPER ADMIN (Prioridad 1 - Totalmente Aislada)
	@Bean
	@Order(1)
	SecurityFilterChain superAdminFilterChain(HttpSecurity http, AdminSistemaDetailsService adminSistemaDetailsService,
			PasswordEncoder passwordEncoder) throws Exception {

		DaoAuthenticationProvider superAdminProvider = new DaoAuthenticationProvider(adminSistemaDetailsService);

		superAdminProvider.setPasswordEncoder(passwordEncoder);

		http.securityMatcher("/admin-seproc/**").authenticationProvider(superAdminProvider)
				.authorizeHttpRequests(auth -> auth.requestMatchers("/admin-seproc/login-seproc").permitAll()
						.requestMatchers("/assets/**", "/css/**", "/js/**", "/images/**").permitAll().anyRequest()
						.hasRole("SUPERADMIN"))
				.formLogin(form -> form.loginPage("/admin-seproc/login-seproc")
						.loginProcessingUrl("/admin-seproc/login-seproc")
						.defaultSuccessUrl("/admin-seproc/dashboard-seproc", true)
						.failureUrl("/admin-seproc/login-seproc?error=true").permitAll())
				.logout(logout -> logout.logoutUrl("/admin-seproc/logout")
						.logoutSuccessUrl("/admin-seproc/login-seproc?logout=true").permitAll());

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

		http.authenticationProvider(clientProvider)
				.addFilterAfter(tenantFilter, UsernamePasswordAuthenticationFilter.class)
				.authorizeHttpRequests(auth -> auth
						// ESTÁTICOS
						.requestMatchers("/assets/**", "/css/**", "/js/**", "/images/**", "/static/**", "/uploads/**")
						.permitAll()

						// PÚBLICOS
						.requestMatchers("/login", "/login/**", "/auth/**", "/public/**", "/registro/**", "/seproc/**",
								"/solicitar-acceso/**")
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
				.formLogin(form -> form
						.loginPage("/login")
						.loginProcessingUrl("/login")
						.successHandler(successHandler)
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
						})
						.permitAll()
					)
					.logout(logout -> logout
						.logoutUrl("/logout")
						.logoutSuccessHandler(logoutHandler) 
						.permitAll()
					);

					return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}