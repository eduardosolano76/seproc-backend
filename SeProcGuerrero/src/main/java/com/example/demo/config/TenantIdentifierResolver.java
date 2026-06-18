package com.example.demo.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {
	
	@Override
    public String resolveCurrentTenantIdentifier() {
        String tenantSchema = TenantContext.getCurrentTenant();
        // Si no hay un tenant establecido (ej. en la pantalla de login o peticiones públicas),
        // asignamos un tenant por defecto para que Hibernate no arroje error.
        return tenantSchema != null ? tenantSchema : "public";
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        // Obliga a Hibernate a validar que la sesión coincida con el tenant actual
        return true; 
    }
}
