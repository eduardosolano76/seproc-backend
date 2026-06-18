package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.modelo.EtapaPlantilla;

@Repository
public interface EtapaPlantillaRepository extends JpaRepository<EtapaPlantilla, Long> {

	@Query("""
	        SELECT e
	        FROM EtapaPlantilla e
	        WHERE e.etapaPadre IS NULL
	          AND e.activo = true
	          AND LOWER(TRIM(e.tipoObra)) = LOWER(TRIM(:tipoObra))
	        ORDER BY e.ordenVisual ASC
	       """)
	List<EtapaPlantilla> buscarRaicesActivasPorTipoObra(@Param("tipoObra") String tipoObra);


	@Query("""
	        SELECT e
	        FROM EtapaPlantilla e
	        WHERE e.etapaPadre.idEtapaPlantilla = :idPadre
	          AND e.activo = true
	        ORDER BY e.ordenVisual ASC
	       """)
	List<EtapaPlantilla> buscarHijasActivasPorPadre(@Param("idPadre") Long idPadre);

	// Busca las sub-etapas de un padre específico DENTRO de la institución
	List<EtapaPlantilla> findByEtapaPadre_IdEtapaPlantillaOrderByOrdenVisualAsc(Long idEtapaPadre);

	// Busca una etapa por su clave interna DENTRO de la institución
	Optional<EtapaPlantilla> findByClaveInterna(String claveInterna);

	// Busca las etapas terminales (donde se suben archivos) activas de un tipo de obra
	// DENTRO de la institución
	List<EtapaPlantilla> findByTipoObraAndActivoTrueAndEsTerminalTrueOrderByOrdenVisualAsc(String tipoObra);

}