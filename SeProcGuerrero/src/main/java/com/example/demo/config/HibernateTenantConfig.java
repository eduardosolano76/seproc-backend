package com.example.demo.config;

import java.util.Map;

import org.hibernate.cfg.MultiTenancySettings;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

@Component
public class HibernateTenantConfig implements HibernatePropertiesCustomizer {

    private final SchemaMultiTenantConnectionProvider connectionProvider;
    private final TenantIdentifierResolver tenantIdentifierResolver;

    public HibernateTenantConfig(
            SchemaMultiTenantConnectionProvider connectionProvider,
            TenantIdentifierResolver tenantIdentifierResolver
    ) {
        this.connectionProvider = connectionProvider;
        this.tenantIdentifierResolver = tenantIdentifierResolver;
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(
                MultiTenancySettings.MULTI_TENANT_CONNECTION_PROVIDER,
                connectionProvider
        );

        hibernateProperties.put(
                MultiTenancySettings.MULTI_TENANT_IDENTIFIER_RESOLVER,
                tenantIdentifierResolver
        );

        hibernateProperties.put(
                MultiTenancySettings.TENANT_IDENTIFIER_TO_USE_FOR_ANY_KEY,
                "public"
        );
    }
}