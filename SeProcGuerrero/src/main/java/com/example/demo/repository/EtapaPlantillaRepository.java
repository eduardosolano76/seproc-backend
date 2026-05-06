package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.modelo.EtapaPlantilla;

@Repository
public interface EtapaPlantillaRepository extends JpaRepository<EtapaPlantilla, Long> {

	// Busca las etapas principales de un tipo de obra específico, activas y ordenadas,
	// DENTRO de la institución
	List<EtapaPlantilla> findByEtapaPadreIsNullAndTipoObraAndActivoTrueOrderByOrdenVisualAsc(String tipoObra);

	// Busca las sub-etapas de un padre específico DENTRO de la institución
	List<EtapaPlantilla> findByEtapaPadre_IdEtapaPlantillaOrderByOrdenVisualAsc(Long idEtapaPadre);

	// Busca una etapa por su clave interna DENTRO de la institución
	Optional<EtapaPlantilla> findByClaveInterna(String claveInterna);

	// Busca las etapas terminales (donde se suben archivos) activas de un tipo de obra
	// DENTRO de la institución
	List<EtapaPlantilla> findByTipoObraAndActivoTrueAndEsTerminalTrueOrderByOrdenVisualAsc(String tipoObra);

}