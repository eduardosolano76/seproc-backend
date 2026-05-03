package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Proyecto;

public interface ProyectoRepository extends JpaRepository<Proyecto, Integer> {

	// -- Metodos multitenant (Blindados por Institución) --

	// Obtener todos los proyectos de la empresa
	List<Proyecto> findByInstitucion(Institucion institucion);

	// Verifica si ya existe un proyecto para una solicitud DENTRO de la institución
	boolean existsByInstitucionAndSolicitud_IdSolicitud(Institucion institucion, Integer idSolicitud);

	// Busca el proyecto de una solicitud específica asegurando que pertenezca a la
	// institución
	Optional<Proyecto> findByInstitucionAndSolicitud_IdSolicitud(Institucion institucion, Integer idSolicitud);

	// Lista proyectos filtrados por estado (ej. "ACTIVO") ordenados por fecha, DENTRO de
	// la institución
	List<Proyecto> findByInstitucionAndEstadoProyectoOrderByFechaAprobacionDesc(Institucion institucion,
			String estadoProyecto);

	// Lista proyectos asignados a un SUPERVISOR específico, filtrados por estado, DENTRO
	// de la institución
	List<Proyecto> findByInstitucionAndIdUsuarioSupervisorAndEstadoProyectoOrderByFechaAprobacionDesc(
			Institucion institucion, Long idUsuarioSupervisor, String estadoProyecto);

	// Lista proyectos de un CONTRATISTA específico, filtrados por estado, DENTRO de la
	// institución
	List<Proyecto> findByInstitucionAndSolicitud_IdUsuarioContratistaAndEstadoProyectoOrderByFechaAprobacionDesc(
			Institucion institucion, Long idUsuarioContratista, String estadoProyecto);

}