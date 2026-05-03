package com.example.demo.repository;

import com.example.demo.modelo.ProyectoEtapaInteraccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProyectoEtapaInteraccionRepository extends JpaRepository<ProyectoEtapaInteraccion, Integer> {

	List<ProyectoEtapaInteraccion> findByProyectoEtapa_IdProyectoEtapaOrderByFechaInteraccionDesc(Long idProyectoEtapa);

	List<ProyectoEtapaInteraccion> findByProyectoEtapa_IdProyectoEtapaOrderByFechaInteraccionAsc(Long idProyectoEtapa);

}